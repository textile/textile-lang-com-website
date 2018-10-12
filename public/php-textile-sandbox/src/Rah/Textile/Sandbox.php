<?php

/**
 * Sandbox for PHP-Textile.
 *
 * @link    https://github.com/gocom/php-textile-sandbox
 * @license MIT
 */

/*
 * Copyright (C) 2013 Jukka Svahn
 *
 * Permission is hereby granted, free of charge, to any person obtaining a
 * copy of this software and associated documentation files (the "Software"),
 * to deal in the Software without restriction, including without limitation
 * the rights to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
 * WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
 * CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

namespace Rah\Textile;
use Netcarver\Textile\Parser as Textile;

/**
 * Textile sandbox parser.
 */

class Sandbox
{
    /**
     * HTTP status code map.
     *
     * @var array
     */

    protected $statusCodes = array(
        500 => 'Internal Server Error',
    );

    /**
     * Parameters.
     *
     * @var array
     */

    protected $parameters = array(
        'method'   => array('restricted'),
        'text'     => '',
        'doctype'  => 'html5',
        'lite'     => false,
        'noimage'  => true,
        'rel'      => 'nofollow',
        'callback' => '',
    );

    /**
     * Maximum Textile input length in bytes.
     *
     * @var int
     */

    protected $maxInputLength = 10000;

    /**
     * Input.
     *
     * @var array
     */

    protected $input = array();

    /**
     * Output.
     *
     * @var string
     */

    protected $output = '';

    /**
     * Cache directory.
     *
     * @var string/bool
     */

    public $cache = false;

    /**
     * Response body.
     *
     * @var string
     */

    protected $responseBody = '';

    /**
     * Request key.
     *
     * @var string|bool
     */

    public $key = false;

    /**
     * Sleep time before response.
     *
     * @var int
     */

    public $sleep = 0;

    /**
     * Constructor.
     *
     * @param  array $options Options
     * @throws \Exception
     */

    public function __construct(array $options = null)
    {
        foreach ((array) $options as $name => $value)
        {
            $this->$name = $value;
        }

        if ($this->cache)
        {
            if (!file_exists($this->cache) || !is_dir($this->cache) || !is_writeable($this->cache))
            {
                throw new \Exception('Invalid cache directory: '.$this->cache);
            }
        }
    }

    /**
     * Initializes.
     *
     * @param array $options Options
     */

    static public function init(array $options = null)
    {
        $input = new Sandbox($options);

        try
        {
            $input->getResponse();
            $input->sendResponse();
        }
        catch (\Exception $e)
        {
            $input->sendResponse(array(
                'status' => 500,
                'error'  => array(
                    'message' => $e->getMessage(),
                )
            ));
        }
    }

    /**
     * Filters input values.
     *
     * @throws \Exception
     */

    protected function filterInput()
    {
        if ($this->input['callback'])
        {
            $reserved = array('break', 'do', 'instanceof', 'typeof', 'case', 'else', 'new', 'var', 'catch', 'finally', 'return', 'void', 'continue', 'for', 'switch', 'while', 'debugger', 'function', 'this', 'with',  'default', 'if', 'throw', 'delete', 'in', 'try', 'class', 'enum',  'extends', 'super', 'const', 'export', 'import', 'implements', 'let', 'private', 'public', 'yield', 'interface', 'package', 'protected', 'static', 'null', 'true', 'false');

            foreach (explode('.', $this->input['callback']) as $part)
            {
                if (!preg_match('/^[$_\p{L}][$_\p{L}\p{Mn}\p{Mc}\p{Nd}\p{Pc}\x{200C}\x{200D}]*+$/u', $part) || in_array(strtolower($part), $reserved))
                {
                    $this->input['callback'] = '';
                    throw new \Exception('Invalid JSON-P callback parameter.');
                }
            }
        }

        if ($this->input['text'] === '')
        {
            throw new \Exception('No Textile input specified.');
        }

        if (strlen($this->input['text']) > $this->maxInputLength)
        {
            throw new \Exception('Maximum input length is '.$this->maxInputLength.' bytes.');
        }

        if (!in_array($this->input['doctype'], array('html5', 'xhtml')))
        {
            throw new \Exception('Invalid specified doctype.');
        }

        foreach ($this->input['method'] as $method)
        {
            if (!in_array($method, array('restricted', 'unrestricted')))
            {
                throw new \Exception('Invalid formatting method.');
            }
        }
    }

    /**
     * Restricted formatter.
     *
     * @return string Processed Textile
     */

    protected function formatRestricted()
    {
        $textile = new Textile($this->input['doctype']);

        return $textile->textileRestricted(
            $this->input['text'],
            $this->input['lite'],
            $this->input['noimage'],
            $this->input['rel']
        );
    }

    /**
     * Un-restricted formatter.
     *
     * @return string Processed Textile
     */

    protected function formatUnrestricted()
    {
        $textile = new Textile($this->input['doctype']);

        return $textile->textileThis(
            $this->input['text'],
            $this->input['lite'],
            false,
            $this->input['noimage'],
            false,
            $this->input['rel']
        );
    }

    /**
     * Gets the response body.
     *
     * @throws \Exception
     */

    public function getResponse()
    {
        $this->input = $this->parameters;

        if ($this->isValidKey() === false)
        {
            throw new \Exception('Access denied due to invalid key.');
        }

        foreach ($this->parameters as $name => $default)
        {
            $value = null;

            if (isset($_GET[$name]))
            {
                $value = $_GET[$name];
            }

            if (isset($_POST[$name]))
            {
                $value = $_POST[$name];
            }

            if ($value !== null)
            {
                if (is_bool($default))
                {
                    $this->input[$name] = (bool) $value;
                }
                else if (is_int($default))
                {
                    $this->input[$name] = (int) $value;
                }
                else if (is_array($default))
                {
                    $this->input[$name] = array_unique((array) $value);
                }
                else
                {
                    $this->input[$name] = (string) $value;
                }
            }
        }

        $this->filterInput();

        if ($this->sleep)
        {
            sleep($this->sleep);
        }

        if ($this->cache && $cacheId = md5(json_encode($this->input)))
        {
            if (file_exists($this->cache . '/' . $cacheId . '.json'))
            {
                $this->responseBody = file_get_contents($this->cache . '/' . $cacheId . '.json');
                return;
            }
        }

        foreach (array('restricted', 'unrestricted') as $name)
        {
            if (in_array($name, $this->input['method']))
            {
                $method = 'format'.ucfirst($name);
                $this->output[$name] = $this->$method();
            }
        }

        $this->responseBody = (string) json_encode(array(
            'options' => $this->input,
            'output'  => $this->output,
        ));

        if ($this->cache && $cacheId)
        {
            file_put_contents($this->cache . '/' . $cacheId . '.json', $this->responseBody);
        }
    }

    /**
     * Validates the given key.
     *
     * @return bool FALSE on error
     */

    protected function isValidKey()
    {
        return $this->key === false || (isset($_REQUEST['key'])  && in_array((string) $_REQUEST['key'], (array) $this->key, true));
    }

    /**
     * Encodes and sends a JSON or JSON-P response.
     *
     * @param  array $input Array to encode and send
     * @throws \Exception
     */

    public function sendResponse(array $input = null)
    {
        header('Access-Control-Allow-Origin: *');
        header('X-Robots-Tag: noindex');

        if (isset($input['status']) && isset($this->statusCodes[$input['status']]))
        {
            header('HTTP/1.1 '.intval($input['status']).' '.$this->statusCodes[$input['status']]);
            header('Status: 500 '.intval($input['status']).' '.$this->statusCodes[$input['status']]);
            unset($input['status']);
        }

        if ($this->responseBody)
        {
            $json = $this->responseBody;
        }
        else
        {
            $json = (string) json_encode($input);
        }

        if ($this->input['callback'])
        {
            header('Content-Type: text/javascript; charset=utf-8');
            echo $this->input['callback'] . '(' . $json . ')';
        }
        else
        {
            header('Content-Type: application/json; charset=utf-8');
            echo $json;
        }
    }
}
