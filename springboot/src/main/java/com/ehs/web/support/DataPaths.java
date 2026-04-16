package com.ehs.web.support;

import com.ehs.web.config.EhsProperties;
import org.springframework.stereotype.Component;

import java.nio.file.Path;

@Component
public class DataPaths {

    private final EhsProperties props;

    public DataPaths(EhsProperties props) {
        this.props = props;
    }

    public Path root() {
        return Path.of(props.getDataRoot()).toAbsolutePath().normalize();
    }

    public Path json(String... parts) {
        Path p = root();
        for (String part : parts) {
            p = p.resolve(part);
        }
        return p;
    }
}
